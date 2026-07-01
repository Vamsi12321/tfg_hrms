"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Calendar, CheckCircle2, AlertCircle, X, Wallet } from "lucide-react";
import { runPayroll, approvePayrollRun, markPayrollPaid, getPayrollRunDetail } from "@/lib/api";
import { usePayrollRuns, useInvalidate } from "@/lib/queries";

const statusCfg = {
  draft:     { cls:"bg-slate-50 text-slate-500 border-slate-200",   label:"Draft"     },
  processed: { cls:"bg-blue-50 text-blue-600 border-blue-200",      label:"Processed" },
  approved:  { cls:"bg-purple-50 text-purple-600 border-purple-200",label:"Approved"  },
  paid:      { cls:"bg-green-50 text-green-600 border-green-200",   label:"Paid"      },
  failed:    { cls:"bg-red-50 text-red-600 border-red-200",         label:"Failed"    },
};

const fmt = (v) => `₹${(v||0).toLocaleString("en-IN")}`;
const MONTHS = Array.from({length:12},(_,i)=>({value:i+1,label:new Date(2025,i).toLocaleDateString("en-US",{month:"long"})}));
const YEARS  = [2024,2025,2026,2027];

export default function PayrollRunsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [runMonth, setRunMonth] = useState(now.getMonth()+1);

  const [showRunModal,  setShowRunModal]  = useState(false);
  const [showDetail,    setShowDetail]    = useState(null);
  const [toast,         setToast]         = useState(null);
  const [formLoading,   setFormLoading]   = useState(false);

  const invalidate = useInvalidate();
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const { data: runsData, isLoading } = usePayrollRuns({ year });
  const runs = runsData?.runs || [];

  const handleRunPayroll = async () => {
    setFormLoading(true);
    const res = await runPayroll({ month: runMonth, year });
    if (res.ok) { showToast(`Payroll processed for ${runMonth}/${year}`); setShowRunModal(false); invalidate("payroll-runs"); invalidate("payslips"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:Array.isArray(res.data?.detail)?res.data.detail.map(e=>e.msg).join(", "):"Failed","error");
    setFormLoading(false);
  };

  const handleApprove = async (runId) => {
    const res = await approvePayrollRun(runId);
    if (res.ok) { showToast("Payroll approved"); invalidate("payroll-runs"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
  };

  const handleMarkPaid = async (runId) => {
    const res = await markPayrollPaid(runId);
    if (res.ok) { showToast("Marked as paid"); invalidate("payroll-runs"); invalidate("payslips"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
  };

  const handleViewDetail = async (run) => {
    const res = await getPayrollRunDetail(run.id||run._id);
    if (res.ok && res.data) setShowDetail(res.data);
    else setShowDetail(run);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select value={year} onChange={e=>setYear(parseInt(e.target.value))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none font-semibold">
            {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowRunModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
          <Play className="w-4 h-4"/> Run Payroll
        </motion.button>
      </div>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : runs.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No payroll runs for {year}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run,i)=>{
            const sc=statusCfg[run.status]||statusCfg.draft;
            return (
              <motion.div key={run.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5 text-brand-600"/></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{MONTHS.find(m=>m.value===run.month)?.label} {run.year}</h4>
                      <p className="text-xs text-slate-500">{run.employee_count||0} employees • {fmt(run.total_net||0)} net pay</p>
                      {run.processed_at&&<p className="text-[10px] text-slate-400">Processed: {new Date(run.processed_at).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                    <button onClick={()=>handleViewDetail(run)} className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100">View</button>
                    {run.status==="processed"&&<button onClick={()=>handleApprove(run.id||run._id)} className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">Approve</button>}
                    {run.status==="approved"&&<button onClick={()=>handleMarkPaid(run.id||run._id)} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100">Mark Paid</button>}
                  </div>
                </div>
                {run.status==="paid"&&(
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-50">
                    {[["Gross",run.total_gross],["Deductions",run.total_deductions],["Net Pay",run.total_net]].map(([l,v])=>(
                      <div key={l} className="text-center"><p className="text-sm font-black text-slate-800">{fmt(v)}</p><p className="text-[10px] text-slate-400">{l}</p></div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Run Payroll Modal */}
      <AnimatePresence>
        {showRunModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowRunModal(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Run Payroll</h3><button onClick={()=>setShowRunModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Month</label>
                  <select value={runMonth} onChange={e=>setRunMonth(parseInt(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    {MONTHS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Year</label>
                  <select value={year} disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-slate-50">
                    {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 mb-5">This will process payroll for all active employees for {MONTHS.find(m=>m.value===runMonth)?.label} {year}.</div>
              <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={handleRunPayroll} disabled={formLoading}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">
                {formLoading?"Processing...":"Run Payroll"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run Detail Modal */}
      <AnimatePresence>
        {showDetail&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowDetail(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Run Detail</h3><button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <div className="space-y-2">
                {[["Month/Year",`${MONTHS.find(m=>m.value===showDetail.month)?.label} ${showDetail.year}`],["Status",showDetail.status],["Employees",showDetail.employee_count||"—"],["Gross",fmt(showDetail.total_gross)],["Deductions",fmt(showDetail.total_deductions)],["Net Pay",fmt(showDetail.total_net)]].map(([k,v])=>(
                  <div key={k} className="flex justify-between py-2 border-b border-slate-50"><span className="text-xs text-slate-500">{k}</span><span className="text-xs font-semibold text-slate-800">{v}</span></div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
