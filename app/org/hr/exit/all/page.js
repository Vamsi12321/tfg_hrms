"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, UserMinus, X, CheckCircle2, AlertCircle, XCircle,
  ChevronLeft, ChevronRight, Download, Eye, Clock, Shield
} from "lucide-react";
import { approveResignation, rejectResignation, updateClearance, completeExit, saveExitInterview, getExitDetail, getExitSettlement } from "@/lib/api";
import { useExitRequests, useDepartments, useInvalidate } from "@/lib/queries";
import { downloadCSV } from "@/lib/excel";

const statusCfg = {
  submitted:          { cls:"bg-amber-50 text-amber-600 border-amber-200",   label:"Submitted"       },
  approved:           { cls:"bg-blue-50 text-blue-600 border-blue-200",       label:"Approved"        },
  clearance_pending:  { cls:"bg-purple-50 text-purple-600 border-purple-200", label:"Clearance Pending"},
  clearance_complete: { cls:"bg-indigo-50 text-indigo-600 border-indigo-200", label:"Clearance Done"  },
  settled:            { cls:"bg-cyan-50 text-cyan-600 border-cyan-200",       label:"Settled"         },
  completed:          { cls:"bg-green-50 text-green-600 border-green-200",    label:"Completed"       },
  rejected:           { cls:"bg-red-50 text-red-500 border-red-200",          label:"Rejected"        },
};

const CLEARANCE_DEPTS = ["hr","finance","it","admin","reporting_manager"];

const EXPORT_COLS = [
  {label:"Employee",key:"employee_name"},{label:"Code",key:"employee_code"},{label:"Department",key:"department"},
  {label:"Type",key:"type"},{label:"Reason",key:"reason"},{label:"Resignation Date",key:"resignation_date"},
  {label:"Last Working Day",key:"last_working_day"},{label:"Status",key:"status"},
];

export default function AllExitsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [deptF, setDeptF] = useState("");
  const invalidate = useInvalidate();

  const { data: exitData, isLoading } = useExitRequests({ page, limit:20, search:search||undefined, status:statusF||undefined, department:deptF||undefined });
  const exits = exitData?.exits || exitData?.requests || [];
  const total = exitData?.total || 0;
  const totalPages = exitData?.pages || 1;
  const { data: deptList = [] } = useDepartments();

  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showApprove, setShowApprove] = useState(null);
  const [showReject, setShowReject] = useState(null);
  const [showClearance, setShowClearance] = useState(null);
  const [showInterview, setShowInterview] = useState(null);
  const [settlement, setSettlement] = useState(null);

  const [approveForm, setApproveForm] = useState({ last_working_day:"", notice_period_days:"60" });
  const [rejectReason, setRejectReason] = useState("");
  const [clearForm, setClearForm] = useState({ department:"hr", status:"cleared", remarks:"" });
  const [interviewForm, setInterviewForm] = useState({ feedback:"", would_rehire:true, rating:4 });

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };
  const errMsg = (res) => typeof res.data?.detail==="string"?res.data.detail:Array.isArray(res.data?.detail)?res.data.detail.map(e=>e.msg).join(", "):"Failed";

  const handleViewDetail = async (exit) => {
    const res = await getExitDetail(exit.id||exit._id);
    if (res.ok) setShowDetail(res.data);
    else setShowDetail(exit);
    // Also fetch settlement
    const sRes = await getExitSettlement(exit.id||exit._id);
    if (sRes.ok) setSettlement(sRes.data);
    else setSettlement(null);
  };

  const handleApprove = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await approveResignation(showApprove.id||showApprove._id, { last_working_day:approveForm.last_working_day, notice_period_days:parseInt(approveForm.notice_period_days)||60 });
    if (res.ok) { showToast("Resignation approved"); setShowApprove(null); invalidate("exit-requests"); invalidate("exit-summary"); }
    else showToast(errMsg(res),"error");
    setFormLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast("Provide a reason","error"); return; }
    setFormLoading(true);
    const res = await rejectResignation(showReject.id||showReject._id, { reason:rejectReason });
    if (res.ok) { showToast("Resignation rejected"); setShowReject(null); setRejectReason(""); invalidate("exit-requests"); }
    else showToast(errMsg(res),"error");
    setFormLoading(false);
  };

  const handleClearance = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await updateClearance(showClearance.id||showClearance._id, clearForm);
    if (res.ok) { showToast(`${clearForm.department} cleared!`); setShowClearance(null); invalidate("exit-requests"); handleViewDetail(showClearance); }
    else showToast(errMsg(res),"error");
    setFormLoading(false);
  };

  const handleComplete = async (exit) => {
    if (!confirm("Complete this exit? Employee will be deactivated.")) return;
    const res = await completeExit(exit.id||exit._id);
    if (res.ok) { showToast("Exit completed — employee deactivated"); invalidate("exit-requests"); invalidate("exit-summary"); setShowDetail(null); }
    else showToast(errMsg(res),"error");
  };

  const handleInterview = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await saveExitInterview(showInterview.id||showInterview._id, { ...interviewForm, rating:parseInt(interviewForm.rating)||4 });
    if (res.ok) { showToast("Interview saved"); setShowInterview(null); }
    else showToast(errMsg(res),"error");
    setFormLoading(false);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400";

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs focus-within:border-brand-400">
          <Search className="w-4 h-4 text-slate-400"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search employee..." className="bg-transparent text-sm placeholder:text-slate-400 outline-none w-full"/>
        </div>
        <select value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none">
          <option value="">All Status</option>
          {Object.keys(statusCfg).map(s=><option key={s} value={s}>{statusCfg[s].label}</option>)}
        </select>
        <select value={deptF} onChange={e=>{setDeptF(e.target.value);setPage(1);}} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none">
          <option value="">All Depts</option>
          {deptList.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
        </select>
        {exits.length>0&&(
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            onClick={()=>downloadCSV(exits,EXPORT_COLS,`exit_requests_${new Date().toISOString().slice(0,10)}.csv`)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-md ml-auto">
            <Download className="w-3.5 h-3.5"/> Export
          </motion.button>
        )}
      </div>

      {/* Table */}
      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : exits.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <UserMinus className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">{search||statusF?"No exits match":"No exit requests yet"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50/80">
                {["Employee","Department","Type","Resignation Date","LWD","Status","Actions"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {exits.map((ex,i)=>{
                  const sc = statusCfg[ex.status]||statusCfg.submitted;
                  return (
                    <motion.tr key={ex.id||ex._id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3"><p className="text-xs font-semibold text-slate-800">{ex.employee_name}</p><p className="text-[10px] text-slate-400">{ex.employee_code}</p></td>
                      <td className="px-4 py-3 text-xs text-slate-600">{ex.department}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 capitalize">{ex.type||"resignation"}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{ex.resignation_date||"—"}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{ex.last_working_day||"—"}</td>
                      <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>handleViewDetail(ex)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center" title="View"><Eye className="w-3.5 h-3.5 text-slate-500"/></button>
                          {ex.status==="submitted"&&<>
                            <button onClick={()=>{setShowApprove(ex);setApproveForm({last_working_day:"",notice_period_days:"60"});}} className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center" title="Approve"><CheckCircle2 className="w-3.5 h-3.5 text-green-600"/></button>
                            <button onClick={()=>{setShowReject(ex);setRejectReason("");}} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center" title="Reject"><XCircle className="w-3.5 h-3.5 text-red-500"/></button>
                          </>}
                          {(ex.status==="clearance_pending"||ex.status==="approved")&&<button onClick={()=>{setShowClearance(ex);setClearForm({department:"hr",status:"cleared",remarks:""});}} className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center" title="Clearance"><Shield className="w-3.5 h-3.5 text-purple-600"/></button>}
                          {(ex.status==="clearance_complete"||ex.status==="settled")&&<button onClick={()=>handleComplete(ex)} className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center" title="Complete"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600"/></button>}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages>1&&(
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} ({total} exits)</p>
              <div className="flex gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-slate-500"/></button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-slate-500"/></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>{setShowDetail(null);setSettlement(null);}}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10 rounded-t-2xl">
                <div><h3 className="text-lg font-bold text-slate-900">{showDetail.employee_name}</h3><p className="text-xs text-slate-500">{showDetail.department} · {showDetail.employee_code}</p></div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${(statusCfg[showDetail.status]||statusCfg.submitted).cls}`}>{(statusCfg[showDetail.status]||statusCfg.submitted).label}</span>
                  <button onClick={()=>{setShowDetail(null);setSettlement(null);}} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                  {[["Type",showDetail.type||"resignation"],["Reason",showDetail.reason||"—"],["Resignation Date",showDetail.resignation_date||"—"],["Last Working Day",showDetail.last_working_day||"Pending"]].map(([k,v])=>(
                    <div key={k} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">{k}</p>
                      <p className="text-xs font-semibold text-slate-800 capitalize">{v}</p>
                    </div>
                  ))}
                </div>

                {/* Clearance */}
                {showDetail.clearance&&(
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-3">Clearance Status</p>
                    <div className="space-y-2">
                      {CLEARANCE_DEPTS.map(dept=>{
                        const c = showDetail.clearance[dept];
                        const cleared = c?.status==="cleared"||c?.status==="waived";
                        return (
                          <div key={dept} className={`flex items-center justify-between p-3 rounded-xl border ${cleared?"bg-green-50 border-green-100":"bg-slate-50 border-slate-100"}`}>
                            <div className="flex items-center gap-2">
                              {cleared?<CheckCircle2 className="w-4 h-4 text-green-500"/>:<Clock className="w-4 h-4 text-slate-300"/>}
                              <span className="text-xs font-semibold text-slate-700 capitalize">{dept.replace("_"," ")}</span>
                            </div>
                            <div className="text-right">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${cleared?"text-green-600 bg-green-100":"text-slate-400 bg-slate-100"}`}>{c?.status||"pending"}</span>
                              {c?.remarks&&<p className="text-[9px] text-slate-400 mt-0.5">{c.remarks}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Settlement */}
                {settlement&&(
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-700 mb-3">Final Settlement</p>
                    {[["Pending Salary",settlement.pending_salary],["Leave Encashment",settlement.leave_encashment],["Bonus Due",settlement.bonus_due],["Deductions",settlement.deductions]].map(([k,v])=>(
                      <div key={k} className="flex justify-between py-1.5"><span className="text-xs text-slate-600">{k}</span><span className="text-xs font-semibold text-slate-800">₹{(v||0).toLocaleString("en-IN")}</span></div>
                    ))}
                    <div className="flex justify-between pt-3 border-t border-indigo-200 mt-2"><span className="text-xs font-bold text-indigo-700">Total Settlement</span><span className="text-sm font-black text-indigo-700">₹{(settlement.total_settlement||0).toLocaleString("en-IN")}</span></div>
                    {settlement.settled&&<p className="text-[10px] text-green-600 mt-1 font-semibold">✓ Settled</p>}
                  </div>
                )}

                {/* Exit Interview */}
                {showDetail.exit_interview?.conducted&&(
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-2">Exit Interview</p>
                    <p className="text-xs text-slate-600 mb-2">{showDetail.exit_interview.feedback}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span>Rating: <strong>{showDetail.exit_interview.rating}/5</strong></span>
                      <span>Would Rehire: <strong>{showDetail.exit_interview.would_rehire?"Yes":"No"}</strong></span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {(showDetail.status==="clearance_pending"||showDetail.status==="approved")&&(
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{setShowClearance(showDetail);setClearForm({department:"hr",status:"cleared",remarks:""}); setShowDetail(null);}}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl text-xs font-semibold hover:bg-purple-100">
                      <Shield className="w-3.5 h-3.5"/> Update Clearance
                    </motion.button>
                  )}
                  {!showDetail.exit_interview?.conducted&&(showDetail.status==="clearance_pending"||showDetail.status==="clearance_complete"||showDetail.status==="approved")&&(
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{setShowInterview(showDetail);setInterviewForm({feedback:"",would_rehire:true,rating:4});}}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100">
                      Record Interview
                    </motion.button>
                  )}
                  {(showDetail.status==="clearance_complete"||showDetail.status==="settled")&&(
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>handleComplete(showDetail)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl text-xs font-bold shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5"/> Complete Exit
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approve Modal */}
      <AnimatePresence>
        {showApprove&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowApprove(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Approve Resignation</h3><button onClick={()=>setShowApprove(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <p className="text-xs text-slate-500 mb-4">Approving <strong>{showApprove.employee_name}</strong>'s resignation</p>
              <form onSubmit={handleApprove} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Last Working Day *</label><input type="date" value={approveForm.last_working_day} onChange={e=>setApproveForm(f=>({...f,last_working_day:e.target.value}))} required className={inputCls}/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notice Period (days)</label><input type="number" value={approveForm.notice_period_days} onChange={e=>setApproveForm(f=>({...f,notice_period_days:e.target.value}))} className={inputCls}/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Approving...":"Approve Resignation"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showReject&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowReject(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Reject Resignation</h3><button onClick={()=>setShowReject(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <p className="text-xs text-slate-500 mb-4">Rejecting <strong>{showReject.employee_name}</strong>'s resignation</p>
              <div className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason *</label><textarea rows={3} value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Critical project deadline — please reconsider" className={`${inputCls} resize-none`}/></div>
                <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={handleReject} disabled={formLoading} className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Rejecting...":"Reject Resignation"}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clearance Modal */}
      <AnimatePresence>
        {showClearance&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowClearance(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Update Clearance</h3><button onClick={()=>setShowClearance(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleClearance} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department *</label>
                  <select value={clearForm.department} onChange={e=>setClearForm(f=>({...f,department:e.target.value}))} className={inputCls}>
                    {CLEARANCE_DEPTS.map(d=><option key={d} value={d} className="capitalize">{d.replace("_"," ")}</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Status *</label>
                  <select value={clearForm.status} onChange={e=>setClearForm(f=>({...f,status:e.target.value}))} className={inputCls}>
                    <option value="cleared">Cleared</option>
                    <option value="waived">Waived</option>
                    <option value="pending">Pending</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Remarks</label><input value={clearForm.remarks} onChange={e=>setClearForm(f=>({...f,remarks:e.target.value}))} placeholder="Laptop returned in good condition" className={inputCls}/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Updating...":"Update Clearance"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Interview Modal */}
      <AnimatePresence>
        {showInterview&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowInterview(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Exit Interview</h3><button onClick={()=>setShowInterview(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleInterview} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Feedback *</label><textarea rows={3} value={interviewForm.feedback} onChange={e=>setInterviewForm(f=>({...f,feedback:e.target.value}))} required placeholder="Good employee, leaving for higher pay" className={`${inputCls} resize-none`}/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Rating (1–5)</label>
                  <select value={interviewForm.rating} onChange={e=>setInterviewForm(f=>({...f,rating:e.target.value}))} className={inputCls}>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} — {["Poor","Below Average","Average","Good","Excellent"][n-1]}</option>)}
                  </select></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={interviewForm.would_rehire} onChange={e=>setInterviewForm(f=>({...f,would_rehire:e.target.checked}))} className="w-4 h-4 rounded border-slate-300"/>
                  <span className="text-xs font-semibold text-slate-700">Would Rehire</span>
                </label>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Saving...":"Save Interview"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
