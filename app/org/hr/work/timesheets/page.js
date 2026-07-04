"use client";

import { todayIST } from "@/lib/date";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, AlertCircle, Eye, X } from "lucide-react";
import { approveTimesheet } from "@/lib/api";
import { useTeamTimesheets, useInvalidate } from "@/lib/queries";

const statusCfg = {
  pending:  { cls:"bg-amber-50 text-amber-600 border-amber-200", label:"Pending"  },
  approved: { cls:"bg-green-50 text-green-600 border-green-200", label:"Approved" },
  rejected: { cls:"bg-red-50 text-red-500 border-red-200",       label:"Rejected" },
};

export default function TeamTimesheetsPage() {
  const invalidate = useInvalidate();
  const [date, setDate]         = useState(todayIST());
  const [statusF, setStatusF]   = useState("pending");
  const [showDetail, setShowDetail] = useState(null);
  const [toast, setToast]       = useState(null);

  const { data: tsData, isLoading } = useTeamTimesheets({ date, status: statusF || undefined });
  const timesheets = tsData?.timesheets || [];

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleAction = async (id, action) => {
    const res = await approveTimesheet(id, action);
    if (res.ok) { showToast(`Timesheet ${action}`); invalidate("team-timesheets"); setShowDetail(null); }
    else showToast("Failed","error");
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-400"/>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400">
          <option value="">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : timesheets.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No timesheets for {date}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {timesheets.map((ts,i)=>{
            const sc=statusCfg[ts.status]||statusCfg.pending;
            return (
              <motion.div key={ts.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-brand-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{ts.employee_name||ts.employee_id}</p>
                      <p className="text-[10px] text-slate-500">{new Date(ts.date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-brand-600">{ts.total_hours}h</span>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                    {ts.status==="pending"&&<>
                      <button onClick={()=>handleAction(ts.id||ts._id,"approved")} className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 flex items-center justify-center" title="Approve"><CheckCircle2 className="w-4 h-4 text-green-600"/></button>
                      <button onClick={()=>handleAction(ts.id||ts._id,"rejected")} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center" title="Reject"><XCircle className="w-4 h-4 text-red-500"/></button>
                    </>}
                  </div>
                </div>
                {/* Entries breakdown */}
                {(ts.entries||[]).length > 0 && (
                  <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50">
                    <div className="space-y-2">
                      {ts.entries.map((entry,j)=>(
                        <div key={j} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100 flex-shrink-0">{entry.project_name||"General"}</span>
                            <span className="text-xs text-slate-600 truncate">{entry.description||"No description"}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-700 flex-shrink-0 ml-3">{entry.hours}h</span>
                        </div>
                      ))}
                    </div>
                    {ts.remarks && <p className="text-[10px] text-slate-400 italic mt-2 pt-2 border-t border-slate-100">Remarks: {ts.remarks}</p>}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowDetail(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div><h3 className="text-lg font-bold text-slate-900">Timesheet Detail</h3><p className="text-xs text-slate-500">{showDetail.employee_name} · {showDetail.date} · {showDetail.total_hours}h</p></div>
                <button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
              </div>
              <div className="space-y-3">
                {(showDetail.entries||[]).map((entry,i)=>(
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">{entry.project_name||"General"}</span>
                      <span className="text-xs font-black text-brand-600">{entry.hours}h</span>
                    </div>
                    {entry.description && <p className="text-[10px] text-slate-500">{entry.description}</p>}
                  </div>
                ))}
              </div>
              {showDetail.remarks && <p className="text-xs text-slate-500 mt-4 italic">Remarks: {showDetail.remarks}</p>}
              {showDetail.status==="pending"&&(
                <div className="flex gap-3 mt-5">
                  <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>handleAction(showDetail.id||showDetail._id,"approved")}
                    className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Approve</motion.button>
                  <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>handleAction(showDetail.id||showDetail._id,"rejected")}
                    className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5"><XCircle className="w-3.5 h-3.5"/> Reject</motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
