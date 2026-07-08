"use client";

import { todayIST } from "@/lib/date";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, AlertCircle, X, Calendar, RefreshCw } from "lucide-react";
import { approveTimesheet } from "@/lib/api";
import { useTeamTimesheets, useInvalidate } from "@/lib/queries";

const statusCfg = {
  pending:  { cls:"bg-amber-50 text-amber-700 border-amber-200/50 shadow-sm",  label:"Pending",  dot:"bg-amber-500"  },
  approved: { cls:"bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-sm", label:"Approved", dot:"bg-emerald-500" },
  rejected: { cls:"bg-rose-50 text-rose-700 border-rose-200/50 shadow-sm",      label:"Rejected", dot:"bg-rose-500"  },
};

export default function TeamTimesheetsPage() {
  const invalidate = useInvalidate();
  const [date, setDate]         = useState(todayIST());
  const [statusF, setStatusF]   = useState("pending");
  const [showDetail, setShowDetail] = useState(null);
  const [toast, setToast]       = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const { data: tsData, isLoading } = useTeamTimesheets({ date, status: statusF || undefined });
  const timesheets = tsData?.timesheets || [];

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleAction = async (id, action) => {
    setActionLoading(id + action);
    const res = await approveTimesheet(id, action);
    if (res.ok) { showToast(`Timesheet ${action}`); invalidate("team-timesheets"); setShowDetail(null); }
    else showToast("Failed","error");
    setActionLoading(null);
  };

  const getInitials = (name = "?") => {
    const p = name.split(" ");
    return p.length >= 2 ? p[0][0] + p[1][0] : name.substring(0,2).toUpperCase();
  };

  const pendingCount  = timesheets.filter(t => t.status === 'pending').length;
  const approvedCount = timesheets.filter(t => t.status === 'approved').length;
  const totalHours    = timesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0);

  return (
    <div className="space-y-6 pb-10">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>
            {toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Team Timesheets</h3>
          <p className="text-sm text-slate-500">Review and approve submitted hours</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 ml-3 mr-1" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-2 py-1.5 text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer" />
            <span className="w-px h-4 bg-slate-200 mx-1" />
            <select value={statusF} onChange={e => setStatusF(e.target.value)}
              className="px-2 py-1.5 text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button onClick={() => invalidate("team-timesheets")}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Entries", value: timesheets.length, color: "text-indigo-700", bg: "bg-indigo-50/60", border: "border-indigo-100/40", dot: "bg-indigo-500" },
          { label: "Pending Review", value: pendingCount, color: "text-amber-700", bg: "bg-amber-50/60", border: "border-amber-100/40", dot: "bg-amber-500" },
          { label: "Approved", value: approvedCount, color: "text-emerald-700", bg: "bg-emerald-50/60", border: "border-emerald-100/40", dot: "bg-emerald-500" },
          { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, color: "text-blue-700", bg: "bg-blue-50/60", border: "border-blue-100/40", dot: "bg-blue-500" },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm`}>
            <div>
              <p className={`text-[10px] font-bold ${k.color.replace('700', '500')} uppercase tracking-wider`}>{k.label}</p>
              <p className={`text-2xl font-black ${k.color} mt-1`}>{k.value}</p>
            </div>
            <span className={`w-3 h-3 rounded-full ${k.dot}`} />
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : timesheets.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-600">No timesheets for {date}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {timesheets.map((ts, i) => {
            const sc = statusCfg[ts.status] || statusCfg.pending;
            return (
              <motion.div key={ts.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col ${ts.status === 'pending' ? 'border-amber-200/50' : 'border-slate-100'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-sm flex-shrink-0">
                      {getInitials(ts.employee_name || ts.employee_id || "?")}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{ts.employee_name || ts.employee_id}</p>
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        {new Date(ts.date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-black text-brand-600">{ts.total_hours}<span className="text-xs text-slate-400 font-semibold ml-0.5">h</span></p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                  </div>
                </div>

                {/* Entries */}
                {(ts.entries || []).length > 0 && (
                  <div className="px-5 pb-4 space-y-2">
                    {ts.entries.map((entry, j) => (
                      <div key={j} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200/50 px-2 py-0.5 rounded-full flex-shrink-0">
                            {entry.project_name || "General"}
                          </span>
                          <span className="text-xs font-medium text-slate-600 truncate">{entry.description || "No description"}</span>
                        </div>
                        <span className="text-xs font-black text-slate-700 flex-shrink-0 ml-3">{entry.hours}h</span>
                      </div>
                    ))}
                    {ts.remarks && <p className="text-[10px] text-slate-400 italic pt-1">Remarks: {ts.remarks}</p>}
                  </div>
                )}

                {/* Actions */}
                {ts.status === "pending" && (
                  <div className="flex gap-2 px-5 pb-5 mt-auto">
                    <button onClick={() => handleAction(ts.id || ts._id, "approved")} disabled={!!actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50">
                      {actionLoading === (ts.id || ts._id) + "approved" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                    </button>
                    <button onClick={() => handleAction(ts.id || ts._id, "rejected")} disabled={!!actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowDetail(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100/50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Timesheet Detail</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{showDetail.employee_name} · {showDetail.date} · {showDetail.total_hours}h</p>
                  </div>
                </div>
                <button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-xl hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-3">
                {(showDetail.entries||[]).map((entry,i)=>(
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900">{entry.project_name || "General"}</p>
                      {entry.description && <p className="text-[10px] font-medium text-slate-500 mt-1 leading-relaxed">{entry.description}</p>}
                    </div>
                    <span className="text-sm font-black text-brand-600 flex-shrink-0">{entry.hours}h</span>
                  </div>
                ))}
                {showDetail.remarks && <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">Remarks: {showDetail.remarks}</p>}
              </div>

              {showDetail.status === "pending" && (
                <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3 bg-slate-50">
                  <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>handleAction(showDetail.id||showDetail._id,"approved")}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </motion.button>
                  <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>handleAction(showDetail.id||showDetail._id,"rejected")}
                    className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Reject
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
