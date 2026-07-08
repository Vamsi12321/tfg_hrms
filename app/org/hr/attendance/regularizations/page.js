"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, AlertCircle, X, Check, XCircle, RefreshCw } from "lucide-react";
import { approveRegularization, rejectRegularization } from "@/lib/api";
import { useRegularizations, useInvalidate } from "@/lib/queries";

const statusCfg = {
  pending:  { cls:"bg-amber-50 text-amber-700 border-amber-200/50 shadow-sm shadow-amber-500/10",  label:"Pending"  },
  approved: { cls:"bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-sm shadow-emerald-500/10",  label:"Approved" },
  rejected: { cls:"bg-rose-50 text-rose-700 border-rose-200/50 shadow-sm shadow-rose-500/10",        label:"Rejected"    },
};

export default function RegularizationsPage() {
  const invalidate = useInvalidate();
  const { data: regs = [], isLoading } = useRegularizations({});
  const [toast, setToast] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleApprove = async (id) => {
    setActionLoading(id);
    const res = await approveRegularization(id);
    if (res.ok) { showToast("Approved"); invalidate("regularizations"); }
    else showToast(res.data?.detail||"Failed","error");
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast("Provide a reason","error"); return; }
    setActionLoading(showRejectModal.id);
    const res = await rejectRegularization(showRejectModal.id, rejectReason);
    if (res.ok) { showToast("Rejected"); setShowRejectModal(null); setRejectReason(""); invalidate("regularizations"); }
    else showToast(res.data?.detail||"Failed","error");
    setActionLoading(null);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const p = name.split(" ");
    if (p.length >= 2) return p[0][0] + p[1][0];
    return name.substring(0,2).toUpperCase();
  };

  const pendingCount = regs.filter(r => r.status === 'pending').length;
  const approvedCount = regs.filter(r => r.status === 'approved').length;
  const rejectedCount = regs.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6 pb-10">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Regularization Requests</h3>
          <p className="text-sm text-slate-500">Review attendance anomaly requests</p>
        </div>
        <button onClick={() => invalidate("regularizations")} title="Refresh Data"
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
          <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: regs.length, color: "text-indigo-700", bg: "bg-indigo-50/60", border: "border-indigo-100/40", dot: "bg-indigo-500" },
          { label: "Pending", value: pendingCount, color: "text-amber-700", bg: "bg-amber-50/60", border: "border-amber-100/40", dot: "bg-amber-500" },
          { label: "Approved", value: approvedCount, color: "text-emerald-700", bg: "bg-emerald-50/60", border: "border-emerald-100/40", dot: "bg-emerald-500" },
          { label: "Rejected", value: rejectedCount, color: "text-rose-700", bg: "bg-rose-50/60", border: "border-rose-100/40", dot: "bg-rose-400" },
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
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      ) : regs.length===0 ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-300"/>
          </div>
          <p className="text-sm font-bold text-slate-500">No regularization requests</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {regs.map((r,i)=>{
            const sc = statusCfg[r.status] || statusCfg.pending;
            const initials = getInitials(r.employee_name);
            return (
              <motion.div key={r.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className={`bg-white rounded-2xl p-5 border ${r.status === 'pending' ? 'border-amber-200 bg-amber-50/10' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all flex flex-col h-full group`}>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm ${r.status === 'pending' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{r.employee_name}</p>
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{r.date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${sc.cls}`}>
                    {sc.label}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100 flex-1">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                      <p className="font-semibold text-slate-700">{r.type?.replace(/_/g," ") || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Proposed Time</p>
                      <p className="font-semibold text-slate-700">{r.proposed_time || "—"}</p>
                    </div>
                    {r.reason && (
                      <div className="col-span-2 pt-2 border-t border-slate-200">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-slate-600 italic line-clamp-2">&quot;{r.reason}&quot;</p>
                      </div>
                    )}
                  </div>
                </div>

                {r.status === "pending" && (
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => handleApprove(r.id)} disabled={actionLoading === r.id}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2.5 rounded-xl hover:bg-emerald-100 hover:text-emerald-800 transition-colors disabled:opacity-50">
                      {actionLoading === r.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                    </button>
                    <button onClick={() => { setShowRejectModal(r); setRejectReason(""); }} disabled={!!actionLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 py-2.5 rounded-xl hover:bg-rose-100 hover:text-rose-700 transition-colors disabled:opacity-50">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
                {r.status === "rejected" && r.rejection_reason && (
                  <div className="mt-auto pt-3 border-t border-rose-50 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-rose-600 line-clamp-2">Reason: {r.rejection_reason}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showRejectModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowRejectModal(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
              
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/30 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Reject Regularization</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">For {showRejectModal.employee_name}</p>
                  </div>
                </div>
                <button onClick={() => setShowRejectModal(null)} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Reason for Rejection *</label>
                <textarea rows={4} value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Provide a reason..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 resize-none mb-6 transition-all bg-slate-50 focus:bg-white"/>
                
                <motion.button disabled={!!actionLoading} whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleReject} 
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 disabled:opacity-70">
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <XCircle className="w-4 h-4" />} Confirm Rejection
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
