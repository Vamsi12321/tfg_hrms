"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, AlertCircle, X } from "lucide-react";
import { approveRegularization, rejectRegularization } from "@/lib/api";
import { useRegularizations, useInvalidate } from "@/lib/queries";

const statusCfg = {
  pending:  { cls:"bg-amber-50 text-amber-600 border-amber-200",  label:"Pending",  border:"border-amber-100"  },
  approved: { cls:"bg-green-50 text-green-600 border-green-200",  label:"Approved", border:"border-green-100"  },
  rejected: { cls:"bg-red-50 text-red-600 border-red-200",        label:"Rejected", border:"border-red-100"    },
};

export default function RegularizationsPage() {
  const invalidate = useInvalidate();
  const { data: regs = [], isLoading } = useRegularizations({});
  const [toast, setToast] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleApprove = async (id) => {
    const res = await approveRegularization(id);
    if (res.ok) { showToast("Approved"); invalidate("regularizations"); }
    else showToast(res.data?.detail||"Failed","error");
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast("Provide a reason","error"); return; }
    const res = await rejectRegularization(showRejectModal.id, rejectReason);
    if (res.ok) { showToast("Rejected"); setShowRejectModal(null); setRejectReason(""); invalidate("regularizations"); }
    else showToast(res.data?.detail||"Failed","error");
  };

  return (
    <div>
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {isLoading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      ) : regs.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No regularization requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {regs.map((r,i)=>{
            const sc=statusCfg[r.status]||statusCfg.pending;
            return (
              <motion.div key={r.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className={`bg-white rounded-2xl p-5 border ${sc.border} shadow-sm`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.employee_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.date} • {r.type?.replace(/_/g," ")} • Proposed: {r.proposed_time||"—"}</p>
                    {r.reason&&<p className="text-xs text-slate-600 mt-1 italic">&quot;{r.reason}&quot;</p>}
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${sc.cls}`}>{sc.label}</span>
                </div>
                {r.status==="pending"&&(
                  <div className="flex gap-2 mt-3">
                    <button onClick={()=>handleApprove(r.id)} className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-4 py-1.5 rounded-lg hover:bg-green-100">✓ Approve</button>
                    <button onClick={()=>{setShowRejectModal(r);setRejectReason("");}} className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-100">✗ Reject</button>
                  </div>
                )}
                {r.status==="rejected"&&r.rejection_reason&&<p className="text-[10px] text-red-500 mt-2">Reason: {r.rejection_reason}</p>}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showRejectModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowRejectModal(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4"><h3 className="text-base font-bold text-slate-900">Reject Regularization</h3><button onClick={()=>setShowRejectModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <textarea rows={3} value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Reason *" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 resize-none mb-4"/>
              <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={handleReject} className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg">Confirm Rejection</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
