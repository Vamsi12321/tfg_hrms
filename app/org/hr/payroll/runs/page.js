"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Calendar, CheckCircle2, AlertCircle, X, Wallet } from "lucide-react";
import { runPayroll, approvePayrollRun, markPayrollPaid, getPayrollRunDetail } from "@/lib/api";
import { usePayrollRuns, useInvalidate } from "@/lib/queries";
import ExportButton from "@/components/ExportButton";

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

      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payroll Runs</h2>
          <p className="text-sm text-slate-500">Manage and process monthly payroll</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <select value={year} onChange={e=>setYear(parseInt(e.target.value))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none font-semibold">
              {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton 
              data={runs}
              filename={`payroll_runs_${year}.csv`}
              columns={[
                { header: "Month", key: "month", render: r => MONTHS.find(m=>m.value===r.month)?.label || r.month },
                { header: "Year", key: "year" },
                { header: "Status", key: "status" },
                { header: "Employee Count", key: "employee_count" },
                { header: "Total Gross", key: "total_gross" },
                { header: "Total Deductions", key: "total_deductions" },
                { header: "Total Net", key: "total_net" }
              ]}
            />
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowRunModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
              <Play className="w-4 h-4"/> Run Payroll
            </motion.button>
          </div>
        </div>
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
            const grad = run.status==="paid" ? "from-emerald-500 to-teal-600" : run.status==="approved" ? "from-purple-500 to-violet-600" : run.status==="processed" ? "from-blue-500 to-indigo-600" : "from-slate-400 to-slate-500";
            return (
              <motion.div key={run.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${grad}`} />
                <div className="p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-md`}><Calendar className="w-5 h-5 text-white"/></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{MONTHS.find(m=>m.value===run.month)?.label} {run.year}</h4>
                      <p className="text-xs text-slate-500">{run.employee_count||0} employees • {fmt(run.total_net||0)} net pay</p>
                      {run.processed_at&&<p className="text-[10px] text-slate-400">Processed: {new Date(run.processed_at).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                    <button onClick={()=>handleViewDetail(run)} className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">View</button>
                    {run.status==="processed"&&<button onClick={()=>handleApprove(run.id||run._id)} className="text-[10px] font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1.5 rounded-lg shadow-sm shadow-green-500/20 hover:opacity-90 transition-opacity">Approve</button>}
                    {run.status==="approved"&&<button onClick={()=>handleMarkPaid(run.id||run._id)} className="text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-500/20 hover:opacity-90 transition-opacity">Mark Paid</button>}
                  </div>
                </div>
                {run.status==="paid"&&(
                  <div className="grid grid-cols-3 divide-x divide-slate-50 border-t border-slate-50">
                    {[["Gross",run.total_gross,"text-slate-700"],["Deductions",run.total_deductions,"text-rose-600"],["Net Pay",run.total_net,"text-emerald-600"]].map(([l,v,c])=>(
                      <div key={l} className="p-3 text-center">
                        <p className={`text-sm font-black ${c}`}>{fmt(v)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{l}</p>
                      </div>
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
          <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Run Payroll</h3>
                  <p className="text-sm text-white/70 mt-0.5">Process monthly salaries</p>
                </div>
                <button onClick={()=>setShowRunModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-white"/></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Month</label>
                  <select value={runMonth} onChange={e=>setRunMonth(parseInt(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100">
                    {MONTHS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Year</label>
                  <select value={year} disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-slate-50 text-slate-400">
                    {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                  <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
                  <p className="text-xs text-amber-700">This will process payroll for all active employees for <strong>{MONTHS.find(m=>m.value===runMonth)?.label} {year}</strong>.</p>
                </div>
                <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={handleRunPayroll} disabled={formLoading}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading?"Processing...":"Run Payroll"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run Detail Modal */}
      <AnimatePresence>
        {showDetail&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowDetail(null)}>
          <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Payroll Run Detail</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{MONTHS.find(m=>m.value===showDetail.month)?.label} {showDetail.year}</p>
                </div>
                <button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-white"/></button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[["Gross",fmt(showDetail.total_gross),"text-slate-700","bg-slate-50"],["Deductions",fmt(showDetail.total_deductions),"text-rose-600","bg-rose-50"],["Net Pay",fmt(showDetail.total_net),"text-emerald-600","bg-emerald-50"]].map(([l,v,c,bg])=>(
                    <div key={l} className={`${bg} rounded-xl p-3 text-center`}>
                      <p className={`text-sm font-black ${c}`}>{v}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-0 rounded-xl overflow-hidden border border-slate-100">
                  {[["Status",showDetail.status],["Employees",showDetail.employee_count||"—"],["Processed At",showDetail.processed_at?new Date(showDetail.processed_at).toLocaleDateString():"—"],["Approved At",showDetail.approved_at?new Date(showDetail.approved_at).toLocaleDateString():"—"]].map(([k,v],idx)=>(
                    <div key={k} className={`flex justify-between px-4 py-3 ${idx%2===0?"bg-slate-50/50":"bg-white"}`}>
                      <span className="text-xs text-slate-500 font-medium">{k}</span>
                      <span className="text-xs font-semibold text-slate-800 capitalize">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
