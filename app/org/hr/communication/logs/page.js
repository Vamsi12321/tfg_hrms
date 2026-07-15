"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Search, ChevronLeft, ChevronRight, Send as SendIcon, Download, X, AlertCircle, CheckCircle2, Clock, User } from "lucide-react";
import { useEmailLogs } from "@/lib/communication-queries";

const STATUS_CFG = {
  delivered: { cls: "bg-green-50 text-green-600 border-green-200", label: "Delivered" },
  sent: { cls: "bg-blue-50 text-blue-600 border-blue-200", label: "Sent" },
  failed: { cls: "bg-red-50 text-red-600 border-red-200", label: "Failed" },
  pending: { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Pending" },
  queued: { cls: "bg-slate-50 text-slate-500 border-slate-200", label: "Queued" },
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
  const [selectedLog, setSelectedLog] = useState(null);

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

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ["Recipient Name", "Recipient Email", "Subject", "Template", "Status", "Sent At"];
    const rows = logs.map(l => [
      l.to_name || "",
      l.to_email || "",
      (l.subject || "").replace(/,/g, " "),
      l.template_slug || "",
      l.status || "",
      l.sent_at || l.created_at || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div><h2 className="text-base font-bold text-slate-900">Sent Emails</h2><p className="text-xs text-slate-400">{total} email{total !== 1 ? "s" : ""} logged</p></div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100"><SendIcon className="w-5 h-5 text-purple-600" /></div>
            <div><h3 className="text-sm font-bold text-slate-900">Email Delivery Log</h3><p className="text-[10px] text-slate-400">Track delivery status of all sent emails</p></div>
          </div>
          <button onClick={exportCSV} disabled={!logs.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-slate-50 flex flex-wrap items-center gap-2">
          {["", "delivered", "sent", "pending", "failed", "bounced"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all ${statusFilter === s ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
              {s || "All"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] outline-none" />
            <span className="text-slate-300 text-[9px]">to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] outline-none" />
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleApply()} placeholder="Search..." className="pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-[9px] outline-none w-28" />
            </div>
            <button onClick={handleApply} className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-bold">Apply</button>
          </div>
        </div>

        {/* Table */}
        {loading ? <div className="p-12 flex justify-center"><div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
        : logs.length === 0 ? (
          <div className="p-12 text-center"><Mail className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No logs found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600">
                {["Recipient", "Subject", "Template", "Status", "Time"].map(h => <th key={h} className="text-left text-[10px] font-bold text-white uppercase px-5 py-3 tracking-wide">{h}</th>)}
              </tr></thead>
              <tbody>
                {logs.map((log, i) => {
                  const sc = STATUS_CFG[log.status] || STATUS_CFG.pending;
                  return (
                    <motion.tr key={log.id || log._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => setSelectedLog(log)}
                      className="border-t border-slate-100 hover:bg-blue-50/30 cursor-pointer transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">{log.to_name || log.to_email}</p>
                        {log.to_name && <p className="text-[9px] text-slate-400">{log.to_email}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[200px] truncate">{log.subject || "—"}</td>
                      <td className="px-5 py-3.5">{log.template_slug ? <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">{log.template_slug}</span> : <span className="text-[9px] text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span></td>
                      <td className="px-5 py-3.5 text-[10px] text-slate-500">{(log.sent_at || log.created_at) ? new Date(log.sent_at || log.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Email Detail Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLog(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    selectedLog.status === "sent" || selectedLog.status === "delivered"
                      ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}>
                    {selectedLog.status === "sent" || selectedLog.status === "delivered"
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <AlertCircle className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Email Details</h3>
                    <p className="text-[10px] text-slate-400">
                      {(selectedLog.sent_at || selectedLog.created_at)
                        ? new Date(selectedLog.sent_at || selectedLog.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"
                      }
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Recipient</p>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedLog.to_name || "—"}</p>
                    <p className="text-[10px] text-slate-500">{selectedLog.to_email}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                    <div className="mt-1">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${(STATUS_CFG[selectedLog.status] || STATUS_CFG.pending).cls}`}>
                        {(STATUS_CFG[selectedLog.status] || STATUS_CFG.pending).label}
                      </span>
                    </div>
                  </div>
                  {selectedLog.template_slug && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Template</p>
                      <p className="text-xs font-semibold text-indigo-600 mt-0.5">{selectedLog.template_slug}</p>
                    </div>
                  )}
                  {selectedLog.employee_id && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee ID</p>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedLog.employee_id}</p>
                    </div>
                  )}
                </div>

                {/* Error Message (if failed) */}
                {selectedLog.error_message && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider mb-1">Error</p>
                    <p className="text-[11px] text-red-700 font-mono break-all leading-relaxed">{selectedLog.error_message}</p>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject</p>
                  <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{selectedLog.subject}</p>
                  </div>
                </div>

                {/* Email Body (rendered HTML) */}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Content</p>
                  <div className="border border-slate-200 rounded-xl p-5 bg-white overflow-y-auto max-h-[300px]">
                    <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: selectedLog.body_html }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
